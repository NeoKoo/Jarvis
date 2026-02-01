#!/bin/bash

# Wait for initial npm install to complete
echo "Waiting for initial npm install to complete..."
while [ ! -d "node_modules" ]; do
  sleep 2
done
echo "Initial install complete!"

# Install PWA dependencies
echo "Installing PWA dependencies..."
npm install --save next-pwa dexie zustand date-fns

# Install shadcn/ui dependencies
echo "Installing shadcn/ui dependencies..."
npm install --save class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-slot

# Install dev dependencies
echo "Installing dev dependencies..."
npm install --save-dev @types/date-fns

echo "All dependencies installed!"
