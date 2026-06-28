import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ProfileClientEnum } from "../enums/profile-client.enum";

@Injectable()
export class ProfileClientGuard implements CanActivate {

    constructor(
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const requiredFunctions = this.reflector.getAllAndOverride<ProfileClientEnum[]>('profiles-client', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredFunctions)
            return true;

        const { user } = context.switchToHttp().getRequest();
        console.log(user);

        // if (!user || !user.profileId) {
        //     return false; // ou você pode lançar uma exceção específica
        // }

        const result = user.profileId.some(a => requiredFunctions.includes(a));

        return result;
    }
}