// Retrieve and return all movies from the database.
// TODO: Implement in a way that single movie can be returned from this endpoint using
// URL query parameter such as "?name=<name>".
export function getAll(req, res) {
    // Stub:
    return res.send(200, {message: 'Successfully reached getAll endpoint.'});
};

// Create a movie
export function createMovie(req, res) {
    // Stub:
    console.log(req.params.name);
    return res.send(200, {message: 'Successfully reached createMovie endpoint.'})
}

// Retrieve and return a single movie by movie ID.
export function getMovieById (req, res) {
    // Stub:
    return res.send(200, {message: 'Successfully reached getByMovieId endpoint.'});
};



// Sample implementations based on Express framework (note: Restify syntax will likely differ)
// Ref: https://www.callicoder.com/node-js-express-mongodb-restful-crud-api-tutorial/

// Get list of all movies:
    // TODO: Add logic to check if movieName was passed in URL (req.params.movieName)
    // Movie.find()
    // .then(movies => {
    //     res.send(movies);
    // }).catch(err => {
    //     res.status(500).send({
    //         message: err.message || "Some error occurred while retrieving movies."
    //     });
    // });


// Get movie by ID:
    // Movie.getByMovieId(req.params.movieId)
    // .then(movie => {
    //     if(!movie) {
    //         return res.status(404).send({
    //             message: "Movie not found with id " + req.params.movieId
    //         });            
    //     }
    //     res.send(movie);
    // }).catch(err => {
    //     if(err.kind === 'ObjectId') {
    //         return res.status(404).send({
    //             message: "Movie not found with id " + req.params.movieId
    //         });                
    //     }
    //     return res.status(500).send({
    //         message: "Error retrieving movie with id " + req.params.movieId
    //     });
    // });