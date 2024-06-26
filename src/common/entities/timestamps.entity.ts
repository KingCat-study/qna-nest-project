import { Property } from '@mikro-orm/core';

export abstract class TimestampsEntity {

    @Property({ type: 'date', 
        onCreate: () => new Date()})
    createdAt: Date;

    @Property({ type: 'date', 
        onCreate:() => new Date() ,
        onUpdate: () => new Date() })
    updatedAt: Date;
}