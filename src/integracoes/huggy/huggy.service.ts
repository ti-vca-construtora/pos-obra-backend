import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class HuggyService {

  private baseUrl = 'https://api.huggy.app/v3';
  private token = process.env.HUGGY_TOKEN;

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'pt-br',
    };
  }

  async buscarContatoPorTelefone(phone: string) {

    const response = await fetch(
      `${this.baseUrl}/contacts?phone=${phone}`,
      {
        method: 'GET',
        headers: this.headers(),
      },
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar contato Huggy');
    }

    const data = await response.json();
    return data?.[0];
  }

  async criarContato(nome: string, phone: string) {

    const response = await fetch(`${this.baseUrl}/contacts`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name: nome,
        phone,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar contato Huggy');
    }

    return response.json();
  }

  async executarFlow(contactId: number, variables: any) {

    const response = await fetch(
      `${this.baseUrl}/contacts/${contactId}/execFlow`,
      {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({
          uuid: process.env.HUGGY_UUID,
          flowId: '473129',
          variables,
          whenInChat: true,
          whenWaitForChat: false,
          whenInAuto: true,
        }),
      },
    );

    const text = await response.text();

    return JSON.parse(text);
  }
}