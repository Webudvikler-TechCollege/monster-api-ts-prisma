import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { generateToken } from "../services/authServices";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

export const Authorize = async (req: Request, res: Response, next: NextFunction) => {
  const bearerHeader = req.headers["authorization"];
  if (!bearerHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token not accepted" });
  }

  const token = bearerHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_ACCESS_KEY!) as any;
    req.user = decoded.data;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      try {
        // Decode access-token UDEN at verificere signaturen (det er udløbet)
        const decoded = jwt.decode(token) as any;
        const userId = decoded?.data?.id;

        if (!userId) {
          return res.status(401).json({ message: "Cannot extract user ID from expired token." });
        }

        // Find brugeren i databasen
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, refreshToken: true }
        });

        if (!user || !user.refreshToken) {
          return res.status(403).json({ message: "No refresh token available." });
        }

        // Verificer refresh token fra databasen
        jwt.verify(user.refreshToken, process.env.TOKEN_REFRESH_KEY!);

        // Generér nyt access token
        const newAccessToken = generateToken({ id: user.id }, "access");

        // Tilføj bruger til request + returnér nyt token
        req.user = { id: user.id };
        // Send nyt access-token tilbage til klienten
        res.status(200).json({ accessToken: newAccessToken });
        
      } catch (err) {
        return res.status(403).json({ message: "Refresh token invalid or expired" });
      }
    }

    return res.status(403).json({ message: error.message });
  }
};
