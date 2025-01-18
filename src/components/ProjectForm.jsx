
const handleSubmit = (e) => {
  e.preventDefault();
  const project = makeProject({
    name,
    estimatedHours: parseInt(estimatedHours) || 0,
    priority: parseInt(priority) || 3,
    allocations: [] // Initialize empty allocations array
  });
  onSubmit(project);
  resetForm();
};
<<<<<<< HEAD
=======
const handleSubmit = (e) => {
  e.preventDefault();
  const project = makeProject({
    name,
    estimatedHours: parseInt(estimatedHours) || 0,
    priority: parseInt(priority) || 3,
    allocations: [] // Initialize empty allocations array
  });
  onSubmit(project);
  resetForm();
};
>>>>>>> Snippet
