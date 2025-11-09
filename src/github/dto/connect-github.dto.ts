import { IsString, MinLength } from 'class-validator';

export class ConnectGithubDto {
  @IsString()
  @MinLength(40, {
    message: 'Token inválido. Deve ter pelo menos 40 caracteres',
  })
  token: string;
}
