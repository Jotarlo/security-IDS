import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import fetch from 'node-fetch';
import {GeneralKeys} from '../configuration/general.keys.configuration';
import {LoginCredentials, ResetPasswordCredentials} from '../models';
import {UserRepository} from '../repositories';
const jwt = require('jsonwebtoken');
const generator = require('generate-password');
var MD5 = require("crypto-js/md5");


@injectable({scope: BindingScope.TRANSIENT})
export class SecurityService {
  constructor(
    @repository(UserRepository)
    private userRepository: UserRepository
  ) { }

  /*
   * Add service methods here
   */

  /**
  * Se genera un token con la información en formato de JWT
  * @param info datos que quedarán en el token
  * @returns token firmado con la clave secreta
  */
  CrearToken(info: object): string {
    try {
      var token = jwt.sign(info, GeneralKeys.jwtKey);
      return token;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Se valida un token si es correcto o no
   * @param tk token a validar
   * @returns boolean con la respuesta
   */
  ValidarToken(tk: string): string {
    try {
      let info = jwt.verify(tk, GeneralKeys.jwtKey);
      console.log(info.role);
      return info.role;
    } catch (err) {
      return "";
    }
  }


  async IdentificarUsuario(credenciales: LoginCredentials): Promise<object | null> {
    let respuesta = {
      token: "",
      user: {
        name: "",
        email: "",
        role: "",
        id: ""
      }
    };
    let usuario = await this.userRepository.findOne({
      where: {
        email: credenciales.username,
        password: credenciales.password
      }
    });

    if (usuario) {
      console.log(usuario)
      let datos = {
        name: `${usuario.name} ${usuario.lastname}`,
        email: usuario.email,
        role: usuario.roleId,
        id: usuario._id!
      }
      try {
        let tk = this.CrearToken(datos);
        respuesta.token = tk;
        respuesta.user = datos;
        console.log("respuesta: " + respuesta);
        console.log(respuesta);
        return respuesta;
      } catch (err) {
        throw err;
      }
    } else {
      return null;
    }
  }

  /**
    * Genera una clave aleatoria
    * @returns clave generada
    */
  CrearClaveAleatoria(): string {
    let password = generator.generate({
      length: 10,
      numbers: true,
      symbols: true,
      uppercase: true
    });
    console.log(password);
    return password;
  }

  /**
   * Cifra una cadena de texto en MD5
   * @param cadena cadena a cifrar
   * @returns Cadena cifrada en MD5
   */
  CifrarCadena(cadena: string): string {
    let cadenaCifrada = MD5(cadena).toString();
    return cadenaCifrada;
  }

  /**
   * Se recupera una clave generándola aleatoriamente y enviándola por correo
   * @param credenciales credenciales del usuario a recuperar la clave
   */
  async RecuperarClave(credenciales: ResetPasswordCredentials): Promise<boolean> {

    const params = new URLSearchParams();
    let usuario = await this.userRepository.findOne({
      where: {
        email: credenciales.email
      }
    });

    if (usuario) {
      let nuevaClave = this.CrearClaveAleatoria();
      let nuevaClaveCifrada = this.CifrarCadena(nuevaClave);
      usuario.password = nuevaClaveCifrada;
      this.userRepository.updateById(usuario._id, usuario);

      let mensaje = `Hola ${usuario.name} <br /> Su contraseña ha sido actualizada satisfactoriamente, y la nueva es ${nuevaClave} <br /><br /> Sí no ha sido usted quien cambio la contraseña por favor tome las medidas correspondientes y llame al *611. <br /><br /> Saludos, su amigo incondicional... equipo de soporte.`;
      console.log("Validator: " + GeneralKeys.HASH_VALIDATOR);

      params.append('hash_validator', GeneralKeys.HASH_VALIDATOR);
      params.append('destination', usuario.email);
      params.append('subject', "Recuperación de contraseña");
      params.append('message', mensaje);

      let r = '';

      await fetch(GeneralKeys.urlEnviarCorreo, {method: 'POST', body: params}).then(async (res: any) => {
        //console.log("2");
        r = await res.text();
        //console.log(r);
      });
      return r == "OK";
    } else {
      throw new HttpErrors[400]("El correo ingresado no está asociado a un usuario");
    }
  }

}
