import { PortEntity } from "../entities/port.entity";

export type updatePortPayload = Pick<PortEntity,'id' | 'type' | 'createdByUserId' | 'name'>