import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../prisma";

interface jwtPayload {
    exp: number;
    data: {
        id: number;
    };
}

const generateToken = (
    user: { id: number },
    type: "access" | "refresh"
): string => {
    const key = process.env[`TOKEN_${type.toUpperCase()}_KEY`];
    const expires_in = process.env[`TOKEN_${type.toUpperCase()}_EXPIRATION_SECS`];

    if (!key || !expires_in) {
        throw new Error(`Missing env vars for ${type} token`);
    }

    const expTime = Math.floor(Date.now() / 1000) + Number(expires_in);
    return jwt.sign({ exp: expTime, data: { id: user.id } }, key);
};

const authenticateUser = async (username: string, password: string) => {

    const user = await prisma.user.findUnique({
        where: { email: username, isActive: true },
        select: {
            id: true,
            name: true,
            password: true,
            isActive: true
        }
    });

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return null;

    const refreshToken = generateToken(user, "refresh");
    const accessToken = generateToken(user, "access");

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken
            }
        });
    } catch (error) {
        console.error(error)
    }

    return {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name },
    };
};

const verifyRefreshToken = async (refreshToken: string) => {
    const user = await prisma.user.findFirst({
        where: { refreshToken }
    });
    if (!user) return null;

    jwt.verify(refreshToken, process.env.TOKEN_REFRESH_KEY!); // will throw if invalid
    const accessToken = generateToken(user, "access");
    return accessToken;
};

const getUserIdFromToken = (token: string): number | null => {
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_ACCESS_KEY!) as jwtPayload;
        return decoded.data.id;
    } catch {
        return null;
    }
};

export {
    authenticateUser,
    verifyRefreshToken,
    getUserIdFromToken,
    generateToken
};
