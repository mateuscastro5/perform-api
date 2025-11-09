import { IsString, MinLength } from 'class-validator';

export class ConnectWithTokenDto {
  @IsString()
  @MinLength(40, { message: 'Token inválido' })
  token: string;
}
