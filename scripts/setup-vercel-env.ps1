# Add all environment variables to Vercel
# This script adds environment variables to the linked Vercel project

$envVars = @(
    @{Name="NEXT_PUBLIC_FIREBASE_API_KEY"; Value="AIzaSyCXeA00EZKDy5yZKxOU8bEcwPe1mC5zRdY"; Sensitive=$false},
    @{Name="NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"; Value="amar-churighor.firebaseapp.com"; Sensitive=$false},
    @{Name="NEXT_PUBLIC_FIREBASE_PROJECT_ID"; Value="amar-churighor"; Sensitive=$false},
    @{Name="NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"; Value="amar-churighor.firebasestorage.app"; Sensitive=$false},
    @{Name="NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"; Value="577927521567"; Sensitive=$false},
    @{Name="NEXT_PUBLIC_FIREBASE_APP_ID"; Value="1:577927521567:web:c52b0017d305b695707c2a"; Sensitive=$false},
    @{Name="NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"; Value="dwbmoe9sz"; Sensitive=$false},
    @{Name="NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"; Value="amar-churighor"; Sensitive=$false},
    @{Name="NEXT_PUBLIC_BASE_URL"; Value="https://amar-churighor.vercel.app"; Sensitive=$false},
    @{Name="SMTP_HOST"; Value="smtp.gmail.com"; Sensitive=$false},
    @{Name="SMTP_PORT"; Value="587"; Sensitive=$false},
    @{Name="SMTP_USER"; Value="mgolam644@gmail.com"; Sensitive=$false},
    @{Name="SMTP_PASS"; Value="dtjp lqnv hfht jnwm"; Sensitive=$true},
    @{Name="SMTP_FROM"; Value="Amar Churighor <mgolam644@gmail.com>"; Sensitive=$false},
    @{Name="ADMIN_EMAIL_RECIPIENTS"; Value="mgolam644@gmail.com"; Sensitive=$false}
)

foreach ($var in $envVars) {
    Write-Host "Adding $($var.Name)..."
    # This is a placeholder - manual setup needed
    Write-Host "  Key: $($var.Name)"
    Write-Host "  Value: $($var.Value)"
    Write-Host "  Sensitive: $($var.Sensitive)"
    Write-Host ""
}

Write-Host "To add these variables, go to: https://vercel.com/smile-pdf/amar-churighorv2-gd7r/settings/environment-variables"