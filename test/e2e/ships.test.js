const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');
const { checkOk } = request;

describe('Ships API', () => {

    beforeEach(() => dropCollection('ships'));

    let spaceTitanic;
    let lilPutPut;

    function saveShip(ship) {
        return request
            .post('/api/ships')
            .send(ship)
            .then(checkOk)
            .then(({ body }) => body);
    }
    
    beforeEach(() => {
        return saveShip({
            name: 'Space Titanic',
            oxygen: 60, 
            lifeSupport: 100, 
            fuel: 100,
            mood: 100,
            payload: 100,
            hull: 100
        })
            .then(data => {
                spaceTitanic = data;
            });
    });
    
    it('saves a ship', () => {
        assert.isOk(spaceTitanic._id);
    });

    beforeEach(() => {
        return saveShip({
            name: 'Lil Put Put',
            oxygen: 30,
            lifeSupport: 90,
            fuel: 95,
            mood: 70,
            payload: 95,
            hull: 90
        })
            .then(data => {
                lilPutPut = data;
            });
    });

    it('saves a 2nd ship', () => {
        assert.isOk(lilPutPut._id);
    });

    it('gets a ship by id', () => {
        return request
            .get(`/api/ships/${spaceTitanic._id}`)
            .then(({ body }) => {
                assert.deepEqual(body, spaceTitanic);
            });
    });

    it('gets a ship\'s average status', () => {
        return request
            .get(`/api/ships/${spaceTitanic._id}/stats`)
            .then(({ body }) => {
                assert.equal(body.avgStatus, '92');
            });
    });

    it('gets ship\'s lowest status value', () => {
        return request
            .get(`/api/ships/${spaceTitanic._id}/min`)
            .then(({ body }) => {
                assert.equal(body.minStatus, '60');
            });
    });

    it('updates ship stats', () => {
        spaceTitanic.oxygen = 50;
        return request
            .put(`/api/ships/${spaceTitanic._id}`)
            .send(spaceTitanic)
            .then(checkOk)
            .then(({ body }) => {
                assert.deepEqual(body, spaceTitanic);
            });
    });

    it.skip('deletes a ship', () => {
        return request
            .delete(`/api/ships/${spaceTitanic._id}`)
            .then(checkOk)
            .then(res => {
                assert.deepEqual(res.body, { removed: true });
                return request.get('/api/ships');
            });
    });
});