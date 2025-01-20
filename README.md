# Next.js ERP Project

This is a Next.js project that involves various API routes and front-end functionalities related to managing categories, columns, users, payments, and other data types for Excel file.

## Table of Contents

- [Next.js Project](#nextjs-project)
  - [Table of Contents](#table-of-contents)
  - [Technologies Used](#technologies-used)
  - [Installation](#installation)
  - [Routes](#routes)
    - [Categories](#categories)
    - [Clerk Users](#clerk-users)
    - [Columns](#columns)
    - [Payments](#payments)
    - [Products](#products)
    - [Image Management](#image-management)
  - [Deployment](#deployment)
    - [Vps Server Specs:](#vps-server-specs)


## Technologies Used

- **Next.js**: For both front-end rendering and back-end API routes.
- **React**: Client-side logic and UI components.
- **Material UI**: For styling, components like DataGrid, Autocomplete, and forms.
- **Clerk**: User management, authentication, and role-based access control.
- **ExcelJS**: For handling Excel file operations, such as reading and writing payment data.
- **Axios**: For handling HTTP requests in the front-end.
- **Day.js**: For date management.
- **Sharp**: For image processing and compression.
- **Node.js**: For file system operations and API handling.
- **TypeScript**: Used in certain parts of the project to ensure type safety.
- **ExpressJS**: Used for hosting the images and preventing image cashing..

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

## Routes
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
- **Serverless Server `(Storing Images Will Not Work)`**

### VPS Specs:

- 1 vCPU
- 2 GB RAM
- 20 GB SSD

### VPS DEPOLYMENT
After installing node, git and configuring the server you should run the program with process manager like pm2 after running npm i and npm run build.

`The project that I have deployed on Vercel is just a demo version, not the real version the client that use :)`

## Screenshots

| ![1](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/1.png) | ![2](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/2.png) |
|:--------------------------------------------------------------------------:|:--------------------------------------------------------------------------:|
| ![3](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/3.png) | ![4](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/4.png) |
| ![5](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/5.png) | ![6](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/6.png) |
| ![7](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/7.png) | ![8](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/8.png) |
| ![9](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/9.png) | ![10](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/10.png) |
| ![11](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/11.png) | ![12](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/12.png) |
| ![13](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/13.png) | ![14](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/14.png) |
| ![15](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/15.png) | ![16](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/16.png) |
| ![17](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/17.png) | ![18](https://github.com/Ahmadalhomsi/meyvali-excel/blob/master/Pics/18.png) |
