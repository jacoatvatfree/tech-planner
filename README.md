# Resource Planner

A React-based resource planning application that helps teams manage projects, allocate resources, and visualize schedules using Gantt charts.

## Features

- **Project Management**: Create and manage projects with estimated hours, priorities, and deadlines
- **Team Management**: Manage team members and their weekly capacity
- **Resource Allocation**: Assign team members to projects with specific time allocations
- **Gantt Visualization**: View project schedules and resource allocation in an interactive Gantt chart
- **Multiple Plans**: Create and manage multiple resource plans
- **Import/Export**: Share plans with others through JSON export/import functionality

## Tech Stack

- React 18
- Vite
- TailwindCSS
- Zustand (State Management)
- Mermaid.js (Gantt Charts)
- React Router
- Date-fns

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/resource-planner.git
cd resource-planner
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:3400`

## Usage

1. Create a new plan or import an existing one
2. Add team members and set their weekly capacity
3. Create projects with estimated hours and deadlines
4. Assign team members to projects
5. View the generated schedule in the Gantt chart
6. Export your plan to share with others

## Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── lib/              # Core business logic
│   └── scheduler/    # Scheduling algorithm
├── store/            # State management
└── utils/            # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Mermaid.js](https://mermaid-js.github.io/) for Gantt chart visualization
- [TailwindCSS](https://tailwindcss.com/) for styling
- [Zustand](https://github.com/pmndrs/zustand) for state management
