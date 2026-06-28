import { SetMetadata } from "@nestjs/common";
import { ProfileClientEnum } from "../enums/profile-client.enum";

export const ProfilesClient = (...functions: ProfileClientEnum[]) => SetMetadata('profiles-client', functions);