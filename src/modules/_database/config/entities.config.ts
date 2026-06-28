import { AgendamentoModel } from '../../agendamentos/models/agendamento.model';
import { EventoAuditoriaModel } from '../../auditoria/models/evento-auditoria.model';
import { ProfileClientModel } from '../../client/models/profile-client.model';
import { UserClientModel } from '../../client/models/user-client.model';
import { ClienteModel } from '../../clientes/models/cliente.model';
import { ItemModel } from '../../itens/models/item.model';
import { OrdemVendaItemModel } from '../../ordens-venda/models/ordem-venda-item.model';
import { OrdemVendaModel } from '../../ordens-venda/models/ordem-venda.model';
import { TipoTransporteModel } from '../../tipos-transporte/models/tipo-transporte.model';

export const entitiesConfig = [
  UserClientModel,
  ProfileClientModel,
  TipoTransporteModel,
  ItemModel,
  ClienteModel,
  OrdemVendaModel,
  OrdemVendaItemModel,
  AgendamentoModel,
  EventoAuditoriaModel,
];
