import { InputType, Field, ID } from '@nestjs/graphql';
import { ProjectRole } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class AddProjectMemberInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field({ description: 'Correo del usuario que quieres invitar' })
  @IsEmail()
  email: string;

  @Field(() => ProjectRole)
  @IsEnum(ProjectRole)
  role: ProjectRole;
}
