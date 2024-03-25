# Running Pace Table

## Overview
The Running Pace Table is a Svelte-based web application designed to display a dynamic table of running paces. It interacts with a FastAPI backend service to retrieve and display data based on the user's input. The application allows users to select minimum and maximum paces, as well as the increment value, and displays a table of calculated paces for various running distances.

## Features
- Interactive table to display running paces
- User input for minimum pace, maximum pace, and increment
- Dynamic data fetching from a FastAPI backend
- Responsive design for desktop and mobile view

## Getting Started
To get a local copy up and running, follow these simple steps.

### Prerequisites
- Ensure you have [Node.js](https://nodejs.org/) installed on your system.

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/cmoron/running_pace_table.git
   ```
2. Navigate to the project directory:
   ```sh
   cd running_pace_table
   ```
3. Install NPM packages:
   ```sh
   npm install
   ```
4. Run the application in development mode:
   ```sh
   npm run dev
   ```
   This will start the application on `localhost:3000` (or another port if 3000 is busy).

## Usage
Use the application to calculate and view running paces. Select the desired minimum pace, maximum pace, and increment to view the table of paces for different distances.

## Deployment
For deployment, build the static files and host them on any static file server or service like Netlify, Vercel, or GitHub Pages.

Run the build command:
```sh
npm run build
```
This command generates static files in the `public` folder which can be deployed.

## Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgements
- [Svelte](https://svelte.dev/)
- [Vite](https://vitejs.dev/)
