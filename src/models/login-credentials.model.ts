import {Model, model, property} from '@loopback/repository';

@model()
export class LoginCredentials extends Model {
  @property({
    type: 'string',
    required: true,
  })
  username: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;


  constructor(data?: Partial<LoginCredentials>) {
    super(data);
  }
}

export interface LoginCredentialsRelations {
  // describe navigational properties here
}

export type LoginCredentialsWithRelations = LoginCredentials & LoginCredentialsRelations;
