const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8574;

app.use(bodyParser.json());

// Array to hold book instances
let books = [];
// Variable to track the next book ID
let bookIDCounter = 1;

// Valid genres for validation
const VALID_GENRES = ["SCI_FI", "NOVEL", "HISTORY", "MANGA", "ROMANCE", "PROFESSIONAL"];

// Class definition for a Book
class Book {
    constructor(id, title, author, year, price, genres) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.year = year;
        this.price = price;
        this.genres = genres;
    }
}

// Function to check if a book with a given title already exists
const bookExists = (title) => {
    return books.some(book => book.title.toLowerCase() === title.toLowerCase());
};

// Function to create a new book
const createBook = (title, author, year, price, genres) => {
    if (bookExists(title)) {
        return { error: `Error: Book with the title [${title}] already exists in the system` };
    }
    if (year < 1940 || year > 2100) {
        return { error: `Error: Can't create new Book that its year [${year}] is not in the accepted range [1940 -> 2100]` };
    }
    if (price <= 0) {
        return { error: `Error: Can't create new Book with negative price` };
    }
    const newBook = new Book(bookIDCounter++, title, author, year, price, genres);
    books.push(newBook);
    return { id: newBook.id };
};

// Function to get the total number of books based on filters
const getTotalBooks = (filters) => {
    let filteredBooks = [...books];

    if (filters.author) {
        filteredBooks = filteredBooks.filter(book => book.author.toLowerCase() === filters.author.toLowerCase());
    }
    if (filters['price-bigger-than']) {
        filteredBooks = filteredBooks.filter(book => book.price >= parseInt(filters['price-bigger-than']));
    }
    if (filters['price-less-than']) {
        filteredBooks = filteredBooks.filter(book => book.price <= parseInt(filters['price-less-than']));
    }
    if (filters['year-bigger-than']) {
        filteredBooks = filteredBooks.filter(book => book.year >= parseInt(filters['year-bigger-than']));
    }
    if (filters['year-less-than']) {
        filteredBooks = filteredBooks.filter(book => book.year <= parseInt(filters['year-less-than']));
    }
    if (filters.genres) {
        const genreList = filters.genres.split(',');
        if (!genreList.every(genre => VALID_GENRES.includes(genre))) {
            return { error: 'Invalid genre provided', status: 400 };
        }
        filteredBooks = filteredBooks.filter(book => book.genres.some(genre => genreList.includes(genre)));
    }

    return { total: filteredBooks.length };
};

// Function to get the book data based on filters
const getBooksData = (filters) => {
    let filteredBooks = [...books];

    if (filters.author) {
        filteredBooks = filteredBooks.filter(book => book.author.toLowerCase() === filters.author.toLowerCase());
    }
    if (filters['price-bigger-than']) {
        filteredBooks = filteredBooks.filter(book => book.price >= parseInt(filters['price-bigger-than']));
    }
    if (filters['price-less-than']) {
        filteredBooks = filteredBooks.filter(book => book.price <= parseInt(filters['price-less-than']));
    }
    if (filters['year-bigger-than']) {
        filteredBooks = filteredBooks.filter(book => book.year >= parseInt(filters['year-bigger-than']));
    }
    if (filters['year-less-than']) {
        filteredBooks = filteredBooks.filter(book => book.year <= parseInt(filters['year-less-than']));
    }
    if (filters.genres) {
        const genreList = filters.genres.split(',');
        if (!genreList.every(genre => VALID_GENRES.includes(genre))) {
            return { error: 'Invalid genre provided', status: 400 };
        }
        filteredBooks = filteredBooks.filter(book => book.genres.some(genre => genreList.includes(genre)));
    }

    // Sort the filtered books by title, case-insensitive
    filteredBooks.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

    return filteredBooks;
};

// Function to get a book by ID
const getBookById = (id) => {
    return books.find(book => book.id == id);
};

// Function to update the price of a book
const updateBookPrice = (id, price) => {
    const book = getBookById(id); // Retrieve the book by ID
    if (!book) {
        return { error: `Error: no such Book with id ${id}`, status: 404 }; // Error if no book found
    }
    if (price <= 0) {
        return { error: `Error: price update for book [${id}] must be a positive integer`, status: 409 }; // Error if price is invalid
    }
    const oldPrice = book.price; // Store the old price
    book.price = parseInt(price); // Update the book price
    return { oldPrice: oldPrice }; // Return the old price
};

// Function to delete a book by ID
const deleteBook = (id) => {
    const bookIndex = books.findIndex(book => book.id == id);
    if (bookIndex === -1) {
        return { error: `Error: no such Book with id ${id}`, status: 404 };
    }
    books.splice(bookIndex, 1); // Remove the book from the array
    return { remainingBooks: books.length }; // Return the remaining number of books
};

// Endpoint to check the server health
app.get('/books/health', (req, res) => {
    res.status(200).send('OK');
});

// Endpoint to create a new book
app.post('/book', (req, res) => {
    const { title, author, year, price, genres } = req.body;

    try {
        const result = createBook(title, author, year, price, genres);
        if (result.error) {
            throw new Error(result.error);
        }
        res.status(200).json({ result: result.id });
    } catch (error) {
        res.status(409).json({ errorMessage: error.message });
    }
});

// Endpoint to get the total number of books based on filters
app.get('/books/total', (req, res) => {
    const filters = req.query;

    try {
        const result = getTotalBooks(filters);
        if (result.error) {
            throw new Error(result.error);
        }
        res.status(200).json({ result: result.total });
    } catch (error) {
        res.status(400).json({ errorMessage: error.message });
    }
});

// Endpoint to get the books data based on filters
app.get('/books', (req, res) => {
    const filters = req.query;

    try {
        const result = getBooksData(filters);
        if (result.error) {
            throw new Error(result.error);
        }
        res.status(200).json({ result });
    } catch (error) {
        res.status(400).json({ errorMessage: error.message });
    }
});

// Endpoint to get a single book by ID
app.get('/book', (req, res) => {
    const { id } = req.query; // Extract the 'id' query parameter from the request

    try {
        const book = getBookById(id); // Find the book by ID
        if (!book) { // If no book is found
            throw new Error(`Error: no such Book with id ${id}`);
        }
        res.status(200).json({ result: book }); // Return the book data wrapped in 'result' field
    } catch (error) {
        res.status(404).json({ errorMessage: error.message }); // Return only the errorMessage field
    }
});

// Endpoint to update a book's price
app.put('/book', (req, res) => {
    const { id, price } = req.query; // Extract 'id' and 'price' query parameters from the request

    try {
        const result = updateBookPrice(id, price); // Call the helper function to update the price
        if (result.error) {
            throw new Error(result.error);
        }
        res.status(200).json({ result: result.oldPrice }); // Return 200 with the old price if update is successful
    } catch (error) {
        if (error.message.includes('price update')) {
            res.status(409).json({ errorMessage: error.message });
        } else {
            res.status(404).json({ errorMessage: error.message });
        }
    }
});

// Endpoint to delete a book by ID
app.delete('/book', (req, res) => {
    const { id } = req.query;

    try {
        const result = deleteBook(id);
        if (result.error) {
            throw new Error(result.error);
        }
        res.status(200).json({ result: result.remainingBooks });
    } catch (error) {
        res.status(404).json({ errorMessage: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
