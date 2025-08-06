// Importer nødvendige typer og biblioteker
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { generateToken } from "../services/authServices";

// Udvid Express' Request-type med en 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

// Middleware til autorisation baseret på JWT
export const Authorize = async (req: Request, res: Response, next: NextFunction) => {
  const bearerHeader = req.headers["authorization"];

  // Tjek om token findes og starter korrekt
  if (!bearerHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token not accepted" });
  }

  // Udtræk selve token-strengen
  const token = bearerHeader.split(" ")[1];

  try {
    // Verificer token og hent brugerdata
    const decoded = jwt.verify(token, process.env.TOKEN_ACCESS_KEY!) as any;
    // Tilføj brugerinfo til request-objektet
    req.user = decoded.data;

    // Gå videre til næste middleware eller route handler
    return next();

  } catch (error: any) {
    // Håndter udløbet access-token
    if (error.name === 'TokenExpiredError') {
      try {
        // Dekodér token (uden at validere) for at få fat i bruger-id
        const decoded = jwt.decode(token) as any;
        const userId = decoded?.data?.id;

        // Hvis vi ikke kan finde bruger-id, afvis
        if (!userId) {
          return res.status(401).json({ message: "Cannot extract user ID from expired token." });
        }

        // Find brugeren i databasen inkl. refresh token
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, refreshToken: true }
        });

        // Hvis ingen refresh token findes, afvis
        if (!user || !user.refreshToken) {
          return res.status(403).json({ message: "No refresh token available." });
        }

        // Verificer refresh token (kan også kaste fejl)
        jwt.verify(user.refreshToken, process.env.TOKEN_REFRESH_KEY!);

        // Generér nyt access-token
        const newAccessToken = generateToken({ id: user.id }, "access");

        // Tilføj bruger til request-objekt
        req.user = { id: user.id };

        // Send nyt token tilbage til klienten
        return res.status(200).json({ accessToken: newAccessToken });

      } catch (err) {
        // Refresh token er ugyldigt eller udløbet
        return res.status(403).json({ message: "Refresh token invalid or expired" });
      }
    } else {
      // Alle andre fejl (fx ugyldig signatur)
      return res.status(403).json({ message: error.message });
    }
  }
};
