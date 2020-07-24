import { DoctypeUtils } from ".."

describe('DoctypeUtils', () => {

    const productSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "http://example.com/product.schema.json",
        "title": "Product",
        "description": "A product from Acme's catalog",
        "type": "object",
        "properties": {
            "productId": {
                "description": "The unique identifier for a product",
                "type": "integer"
            }
        },
        "required": [ "productId" ]
    }

    it('validates against correct data', async () => {
        DoctypeUtils.validate({
            productId: 7
        }, productSchema)
    })

    it('validates against incorrect data', async () => {
        try {
            DoctypeUtils.validate({
                productId: "some text"
            }, productSchema)
            throw new Error('Should not be able to pass validation')
        } catch (e) {
            expect(e.message).toContain('Validation Error: data.productId should be integer')
        }
    })
})
