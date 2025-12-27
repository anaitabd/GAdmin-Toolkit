const Joi = require('joi');

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                error: {
                    message: 'Validation failed',
                    details: errors
                }
            });
        }
        
        next();
    };
};

// Email validation schema
const emailSendSchema = Joi.object({
    method: Joi.string().valid('api', 'smtp').required(),
    user: Joi.string().email().required(),
    password: Joi.string().when('method', {
        is: 'smtp',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    recipient: Joi.string().email().required(),
    from: Joi.string().required(),
    subject: Joi.string().required(),
    htmlContent: Joi.string().required()
});

const validateEmailSend = validateRequest(emailSendSchema);

module.exports = validateRequest;
module.exports.validateEmailSend = validateEmailSend;
