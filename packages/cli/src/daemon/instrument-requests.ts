
module.exports = function instrumentRequests(req, res, next) {

  const token = req.header("authorization")
  const agent = req.header("user-agent") 
  // do some metrics
  next()
}

