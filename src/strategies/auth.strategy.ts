import {AuthenticationStrategy} from '@loopback/authentication';
import {BindingScope, injectable, service} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {GeneralKeys} from '../configuration/general.keys.configuration';
import {SecurityService} from '../services';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthorizationStrategy implements AuthenticationStrategy {
  name = "admin";

  constructor(
    @service(SecurityService)
    private secService: SecurityService
  ) {

  }

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token = parseBearerToken(request);
    console.log(`Token de la request: ${token}`);
    if (token) {
      let roleId = this.secService.ValidarToken(token);
      if (roleId) {
        console.log(roleId);
        if (roleId == GeneralKeys.adminRolId) {
          // validar el id
          let perfil: UserProfile = Object.assign({
            admin: 'OK',
          });
          return perfil;
        }
      } else {
        throw new HttpErrors[401]("Solicitud rechazada porque el token enviado no es válido.");
      }
    } else {
      throw new HttpErrors[401]("Solicitud rechazada porque no tiene un token.");
    }
  }
}
