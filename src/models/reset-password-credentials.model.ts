import {Model, model, property} from '@loopback/repository';

@model()
export class ResetPasswordCredentials extends Model {
  @property({
    type: 'string',
    required: true,
  })
  email: string;


  constructor(data?: Partial<ResetPasswordCredentials>) {
    super(data);
  }
}

export interface ResetPasswordCredentialsRelations {
  // describe navigational properties here
}

export type ResetPasswordCredentialsWithRelations = ResetPasswordCredentials & ResetPasswordCredentialsRelations;
