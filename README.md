# Next.js Project

This is a Next.js project that involves various API routes and front-end functionalities related to managing categories, columns, users, payments, and other data types.

## Table of Contents

- [Next.js Project](#nextjs-project)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Categories](#categories)
    - [Clerk Users](#clerk-users)
    - [Columns](#columns)
    - [Payments](#payments)
    - [Products](#products)
    - [Image Management](#image-management)
  - [Deployment](#deployment)
    - [Vps Server Specs:](#vps-server-specs)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Ahmadalhomsi/meyvali-excel.git
    cd your-repository
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Run the development server:
    ```bash
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.


### Categories

- **GET `/api/categories`**: Fetches the list of categories from the `categories.txt` file.
- **POST `/api/categories`**: Adds a new category to the list.
- **DELETE `/api/categories`**: Removes a category from the list.

### Clerk Users

- **GET `/api/clerk-users`**: Fetches the list of users from Clerk.
- **POST `/api/clerk-users`**: Updates the role of a user in Clerk.

### Columns

- **GET `/api/columns`**: Fetches column information for a given page.
- **POST `/api/columns`**: Adds a column to the page.
- **PUT `/api/columns`**: Updates a column name or letter.
- **DELETE `/api/columns`**: Deletes a column from the page.

### Payments

- **GET `/api/payments`**: Retrieves the list of payments filtered by date.
- **PUT `/api/payments`**: Updates payment details including product, price, and image.
- **DELETE `/api/payments`**: Deletes a payment and optionally its associated image.
  
### Products

- **GET `/api/products`**: Retrieves the list of products filtered by date.
- **PUT `/api/products`**: Updates products details including product, price, and image.
- **DELETE `/api/products`**: Deletes a products and optionally its associated image.

### Image Management

- **GET `/api/images`**: Fetches the list of uploaded images.
- **POST `/api/images`**: Deletes selected images.

Images are stored in the `public/uploads` directory. Each image is managed via API routes and can be uploaded, retrieved, or deleted.

## Deployment

I recommend for this project to be deployed on:

- **VPS Server `(What I Use)`**
- **Serverless Server (Storing Images Will Not Work)**

### Vps Server Specs:

- 1 V CPU
- 2 GB RAM
- 20 GB SSD

