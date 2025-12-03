# Script para probar el flujo completo de reviews
# 1. Crear pedido
# 2. Cambiar a preparing
# 3. Cambiar a ready
# 4. Crear review
# 5. Listar reviews

$API_URL = "http://localhost:3000"
$KITCHEN_URL = "http://localhost:3002"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE REVIEW FLOW" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Crear pedido
Write-Host "1. Creating new order..." -ForegroundColor Yellow
$orderPayload = @{
    customerName = "Test Customer"
    customerEmail = "test@example.com"
    items = @(
        @{
            name = "Burger"
            quantity = 1
            price = 10.99
        }
    )
} | ConvertTo-Json

try {
    $orderResponse = Invoke-RestMethod -Uri "$API_URL/orders" -Method POST -Body $orderPayload -ContentType "application/json"
    $orderId = $orderResponse.data.orderId
    Write-Host "✅ Order created: $orderId" -ForegroundColor Green
    Write-Host "   Customer: $($orderResponse.data.customerName)" -ForegroundColor Gray
    Write-Host "   Email: $($orderResponse.data.customerEmail)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to create order: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# 2. Start preparing
Write-Host "`n2. Starting order preparation..." -ForegroundColor Yellow
try {
    $preparingResponse = Invoke-RestMethod -Uri "$KITCHEN_URL/kitchen/orders/$orderId/start" -Method PATCH
    Write-Host "✅ Order is now PREPARING" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start preparing: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# 3. Mark as ready
Write-Host "`n3. Marking order as ready..." -ForegroundColor Yellow
try {
    $readyResponse = Invoke-RestMethod -Uri "$KITCHEN_URL/kitchen/orders/$orderId/ready" -Method PATCH
    Write-Host "✅ Order is now READY" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to mark as ready: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# 4. Create review
Write-Host "`n4. Creating review..." -ForegroundColor Yellow
$reviewPayload = @{
    orderId = $orderId
    customerName = "Test Customer"
    customerEmail = "test@example.com"
    ratings = @{
        overall = 5
        food = 5
    }
    comment = "Excellent food and service!"
} | ConvertTo-Json

try {
    $reviewResponse = Invoke-RestMethod -Uri "$API_URL/reviews" -Method POST -Body $reviewPayload -ContentType "application/json"
    Write-Host "✅ Review created successfully" -ForegroundColor Green
    Write-Host "   Review ID: $($reviewResponse.data.id)" -ForegroundColor Gray
    Write-Host "   Status: $($reviewResponse.data.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to create review: $_" -ForegroundColor Red
    Write-Host "   Error details: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 5. List reviews (should be pending)
Write-Host "`n5. Listing public reviews (only approved)..." -ForegroundColor Yellow
try {
    $reviewsResponse = Invoke-RestMethod -Uri "$API_URL/reviews?page=1&limit=10" -Method GET
    $reviewCount = $reviewsResponse.data.Count
    Write-Host "✅ Found $reviewCount approved reviews" -ForegroundColor Green

    if ($reviewCount -eq 0) {
        Write-Host "   ⚠️  New review is 'pending' - not visible in public list" -ForegroundColor Yellow
        Write-Host "   ℹ️  Reviews need admin approval to be visible" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to list reviews: $_" -ForegroundColor Red
}

# 6. List all reviews (admin endpoint)
Write-Host "`n6. Listing ALL reviews (admin)..." -ForegroundColor Yellow
try {
    $adminReviewsResponse = Invoke-RestMethod -Uri "$API_URL/admin/reviews?page=1&limit=10" -Method GET
    $adminCount = $adminReviewsResponse.data.Count
    Write-Host "✅ Found $adminCount total reviews" -ForegroundColor Green

    if ($adminCount -gt 0) {
        Write-Host "`n   Last review:" -ForegroundColor Cyan
        $lastReview = $adminReviewsResponse.data[0]
        Write-Host "   - Order ID: $($lastReview.orderId)" -ForegroundColor Gray
        Write-Host "   - Customer: $($lastReview.customerName)" -ForegroundColor Gray
        Write-Host "   - Status: $($lastReview.status)" -ForegroundColor Gray
        Write-Host "   - Overall: $($lastReview.ratings.overall)/5" -ForegroundColor Gray
        Write-Host "   - Food: $($lastReview.ratings.food)/5" -ForegroundColor Gray
        Write-Host "   - Comment: $($lastReview.comment)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to list admin reviews: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLETED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Reviews start with status='pending'" -ForegroundColor Gray
Write-Host "   2. Use admin panel to approve: PATCH /reviews/{id}/status" -ForegroundColor Gray
Write-Host "   3. Only approved reviews appear in public list" -ForegroundColor Gray
Write-Host "   4. Test in browser: http://localhost:5173`n" -ForegroundColor Gray
