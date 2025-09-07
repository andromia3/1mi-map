# Database Setup Script for 1MI Members' Club
# This script sets up the database connection and runs seeding

Write-Host "🚀 Setting up 1MI Members' Club Database..." -ForegroundColor Green

# Create .env file with Direct connection for Prisma CLI
$envContent = @'
DATABASE_URL="postgresql://postgres:p3V9tQG2rJ6xN1yW8kZ5cH4mB7uR3qT@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
'@

Write-Host "📝 Creating .env file with Direct connection..." -ForegroundColor Yellow
$envContent | Out-File -FilePath .env -Encoding utf8

Write-Host "🔧 Pushing database schema..." -ForegroundColor Yellow
npx prisma db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema created successfully!" -ForegroundColor Green
    
    Write-Host "🌱 Seeding database with demo users..." -ForegroundColor Yellow
    npx prisma db seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database seeding completed successfully!" -ForegroundColor Green
        Write-Host "🎉 Setup complete! You can now run 'npm run dev' to start the application." -ForegroundColor Green
    } else {
        Write-Host "❌ Database seeding failed!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Database schema creation failed!" -ForegroundColor Red
}

Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create .env.local with Transaction Pooler connection for runtime" -ForegroundColor White
Write-Host "2. Add your MAPBOX_TOKEN and SESSION_PASSWORD to .env.local" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor White
