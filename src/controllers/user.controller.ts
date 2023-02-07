import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {LoginCredentials, ResetPasswordCredentials, User} from '../models';
import {UserRepository} from '../repositories';
import {SecurityService} from '../services';

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @service(SecurityService)
    private secService: SecurityService
  ) { }

  @post('/user')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['_id'],
          }),
        },
      },
    })
    user: Omit<User, '_id'>,
  ): Promise<User> {
    user.status = false;
    let nuevaClave = this.secService.CrearClaveAleatoria();
    let claveCifrada = this.secService.CifrarCadena(nuevaClave);
    user.password = claveCifrada;
    console.log(nuevaClave);
    return this.userRepository.create(user);
  }

  @get('/user/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/user')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @patch('/user')
  @response(200, {
    description: 'User PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.updateAll(user, where);
  }

  @get('/user/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @patch('/user/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(id, user);
  }

  @put('/user/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @del('/user/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.userRepository.deleteById(id);
  }

  @post('/login')
  @response(200, {
    description: 'Identificación de Usuarios',
    content: {'application/json': {schema: getModelSchemaRef(LoginCredentials)}},
  })
  async identificar(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(LoginCredentials),
        },
      },
    })
    credenciales: LoginCredentials,
  ): Promise<object> {
    try {
      let obj = await this.secService.IdentificarUsuario(credenciales);
      if (obj) {
        return obj;
      }
      return new HttpErrors[401]("Datos inválidos");
    } catch (err) {
      throw new HttpErrors[400](`Se ha generado un error en la validación de las credenciales para el usuario ${credenciales.username}`);
    }
  }


  @post('/recuperar-clave')
  @response(200, {
    description: 'Identificación de Usuarios',
    content: {'application/json': {schema: getModelSchemaRef(LoginCredentials)}},
  })
  async RecuperarClave(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ResetPasswordCredentials),
        },
      },
    })
    credenciales: ResetPasswordCredentials,
  ): Promise<boolean> {
    try {
      return this.secService.RecuperarClave(credenciales);
    } catch (err) {
      throw new HttpErrors[400](`Se ha generado un error en la recuperación de la clave para el correo ${credenciales.email}`);
    }
  }

}
