
/**
 *  Retrieve and return all movies 
 *  Filter movies by name "?q=<name>"
 */
export function getAll(req, res) {
    // Stub:
    return res.send(200, {message: 'Successfully reached getAll endpoint.'});
};

/**
 *  Create a movie
 */
export function createMovie(req, res) {
    // Stub:
    console.log(req.params.name);
    return res.send(200, {message: 'Successfully reached createMovie endpoint.'})
}

/**
 * Retrieve and return a single movie by movie ID.
 */
export function getMovieById (req, res) {
    // Stub:
    return res.send(200, {message: 'Successfully reached getByMovieId endpoint.'});
};
