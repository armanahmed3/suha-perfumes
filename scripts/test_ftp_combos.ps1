[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$users = @("admin", "admin@suhaperfumes.com", "suhaperfumes", "suha")
$pass = "dd2244889"
$hosts = @("ftp://66.94.103.134/", "ftp://suhaperfumes.com/")

foreach ($h in $hosts) {
    foreach ($u in $users) {
        foreach ($ssl in @($true, $false)) {
            try {
                $req = [System.Net.FtpWebRequest]::Create($h)
                $req.Credentials = New-Object System.Net.NetworkCredential($u, $pass)
                $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
                $req.UsePassive = $true
                $req.EnableSsl = $ssl
                $req.Timeout = 5000
                $res = $req.GetResponse()
                $stream = $res.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $out = $reader.ReadToEnd()
                Write-Host ">>> SUCCESS with host=$h user=$u ssl=$ssl <<<"
                Write-Host $out
                $reader.Close()
                $res.Close()
                exit 0
            } catch {
                Write-Host "FAILED host=$h user=$u ssl=$ssl : $($_.Exception.Message)"
                if ($_.Exception.InnerException) {
                    Write-Host "   Inner: $($_.Exception.InnerException.Message)"
                }
            }
        }
    }
}
