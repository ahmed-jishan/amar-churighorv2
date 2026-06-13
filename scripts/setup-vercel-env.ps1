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
    @{Name="RESEND_API_KEY"; Value="re_BBonNudL_6aDybn6dfdHe7gviYbHsMyUS"; Sensitive=$true}
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