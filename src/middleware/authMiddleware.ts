import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

export const Authorize = (req: Request, res: Response, next: NextFunction) => {
  const bearerHeader = req.headers["authorization"];
  if (!bearerHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token not accepted" });
    return;
  }

  try {
    const token = bearerHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.TOKEN_ACCESS_KEY!) as any;
    req.user = decoded.data;
    next();
  } catch (error: any) {
    res.status(403).json({ message: error.message });
  }
};
