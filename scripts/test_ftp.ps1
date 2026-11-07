$request = [System.Net.FtpWebRequest]::Create("ftp://66.94.103.134/")
$request.Credentials = New-Object System.Net.NetworkCredential("admin@suhaperfumes.com", "dd2244889")
$request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
$request.Timeout = 8000
$request.UsePassive = $false
try {
    $response = $request.GetResponse()
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $list = $reader.ReadToEnd()
    Write-Host "FTP CONNECTION SUCCESSFUL (Active Mode):"
    Write-Host $list
    $reader.Close()
    $response.Close()
} catch {
    Write-Host "FTP ACTIVE ERROR: $($_.Exception.Message)"
    if ($_.Exception.InnerException) {
        Write-Host "INNER: $($_.Exception.InnerException.Message)"
    }
}
