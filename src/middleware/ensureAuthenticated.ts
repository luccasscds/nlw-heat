import { Request, Response, NextFunction, request } from "express";
import {verify} from "jsonwebtoken";

interface IPlayload {
    sub: string
}

export function ensureAuthenticated(resquet: Request, response: Response, next: NextFunction) {
    const authToken = resquet.headers.authorization;

    if(!authToken) {
        return response.status(401).json({
            error: "token.invalid",
        });
    }

    const [, token] = authToken.split(" ");

    try {
        const {sub} = verify(token, process.env.JWT_SECRET) as IPlayload;
        request.user_id = sub;

        return next();
    } catch (error) {
        return response.status(401).json({error: "token expired"});
    }
}