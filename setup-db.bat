@echo off
echo 🚀 Setting up 1MI Members' Club Database...

echo 📝 Creating .env file with Direct connection...
echo DATABASE_URL="postgresql://postgres:p3V9tQG2rJ6xN1yW8kZ5cH4mB7uR3qT@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require" > .env

echo 🔧 Pushing database schema...
npx prisma db push

if %errorlevel% equ 0 (
    echo ✅ Database schema created successfully!
    
    echo 🌱 Seeding database with demo users...
    npx prisma db seed
    
    if %errorlevel% equ 0 (
        echo ✅ Database seeding completed successfully!
        echo 🎉 Setup complete! You can now run 'npm run dev' to start the application.
    ) else (
        echo ❌ Database seeding failed!
    )
) else (
    echo ❌ Database schema creation failed!
)

echo.
echo 📋 Next steps:
echo 1. Create .env.local with Transaction Pooler connection for runtime
echo 2. Add your MAPBOX_TOKEN and SESSION_PASSWORD to .env.local
echo 3. Run 'npm run dev' to start the development server

pause
