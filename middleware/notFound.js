function notFound(req, res, next) {
    return res.status(404).json({
        error: true,
        message: 'endpoint not found'

    })


}

module.exports = notFound