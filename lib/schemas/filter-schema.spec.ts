import { FilterSchema } from './filter-schema';
import { StringField } from '../fields/primitives/string-field';

describe('FilterSchema', () => {
    const fields = [
        new StringField('q', 'Arama'),
        new StringField('status', 'Durum')
    ];
    const schema = new FilterSchema(fields);

    it('should ignore empty values in toParams (Pruning)', () => {
        const filter = schema.createFilter({ q: 'test', status: '' });

        const params = filter.toParams();

        expect(params).toHaveProperty('q', 'test');
        expect(params).not.toHaveProperty('status'); // Boş olduğu için atılmalı
    });

    it('should load values from Query Params string', () => {
        const filter = schema.createFilter();

        // URL'den gelen her şey stringdir
        filter.loadFromParams({ q: 'hello', status: 'active' });

        expect(filter.values()["q"]).toBe('hello');
        expect(filter.values()["status"]).toBe('active');
    });

    it('should calculate active filters badge count', () => {
        const filter = schema.createFilter();

        expect(filter.count()).toBe(0);
        expect(filter.isEmpty()).toBe(true);

        filter.fields["q"].value.set('ara');

        expect(filter.count()).toBe(1);
        expect(filter.activeFilters()[0].label).toBe('Arama');
        expect(filter.activeFilters()[0].value).toBe('ara');
    });
});