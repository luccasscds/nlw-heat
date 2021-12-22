import axios from "axios";
import prismaCleint from "../prisma";
import {sign} from "jsonwebtoken";

interface IaccessTokenResponse {
    access_token: string
}

interface IUserResponse {
    avatar_url: string,
    login: string,
    id: number,
    name: string
}

class AuthenticateUserService {
    async execute(code: string) {
        const url = "https://github.com/login/oauth/access_token";
        const {data: accessTokenResponse} = await axios.post<IaccessTokenResponse>(url,null, {
            params: {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code
            },
            headers: {
                "Accept": "application/json"
            }
        })

        const response = await axios.get<IUserResponse>("https://api.github.com/user", {
            headers: {
                authorization: `Bearer ${accessTokenResponse.access_token}`
            }
        });

        const {login,id,avatar_url,name} = response.data;

        let user = await prismaCleint.user.findFirst({
            where: {
                github_id: id
            }
        });

        if(!user) {
            user = await prismaCleint.user.create({
                data: {
                    github_id: id,
                    login,
                    avatar_url,
                    name
                }
            });
        }

        const token = sign({user: {
            name: user.name,
            avatar_url: user.avatar_url,
            id: user.id
        }},process.env.JWT_SECRET,
        {
            subject: user.id,
            expiresIn: "1d"
        });

        // return response.data;
        return {token, user};
    }
}

export {AuthenticateUserService}