# Grant kuota AI (trip_passes) untuk 1 user. Kunci hanya di memori, tidak dicetak.
param([string]$Email='', [int]$Amount=10, [switch]$WhatIf, [switch]$Diag, [switch]$Force)
$ErrorActionPreference='Stop'
function Fail($m){Write-Output "STOP: $m";exit 1}
function GetVar($n){$m=Select-String -Path '.dev.vars' -Pattern ("^"+$n+"\s*=\s*[`"']?([^`"'`r`n]+)")|Select-Object -First 1;if(-not $m){return $null};return $m.Matches[0].Groups[1].Value}
if(-not $Email){Fail('Email kosong.')}
$url=GetVar 'SUPABASE_URL';$key=GetVar 'SUPABASE_SECRET_KEY';if(-not $key){$key=GetVar 'SUPABASE_SERVICE_ROLE_KEY'}
if(-not $url -or -not $key){Fail('SUPABASE_URL/kunci tidak ada di .dev.vars.')}
Write-Output ("proyek: "+([uri]$url).Host)
$h=@{apikey=$key};if($key -notlike 'sb_secret_*'){$h['Authorization']='Bearer '+$key}
if($Diag){Write-Output ("panjang kunci: "+$key.Length+" chars");$qu='https://aytrcvfncsklhqozreyk.supabase.co';foreach($t in @(@('worker-REST',$url+'/rest/v1/trip_passes?select=id&limit=1'),@('qa-REST',$qu+'/rest/v1/trip_passes?select=id&limit=1'),@('worker-authadmin',$url+'/auth/v1/admin/users?per_page=1'),@('qa-authadmin',$qu+'/auth/v1/admin/users?per_page=1'))){try{$r=Invoke-WebRequest -Uri $t[1] -Headers $h -UseBasicParsing -TimeoutSec 30;Write-Output ($t[0]+": HTTP "+$r.StatusCode)}catch{Write-Output ($t[0]+": GAGAL "+$_.Exception.Response.StatusCode)}};$key=$null;exit 0}
try{$raw=(Invoke-WebRequest -Uri ($url+'/auth/v1/admin/users?per_page=100') -Headers $h -UseBasicParsing -TimeoutSec 30).Content|ConvertFrom-Json}catch{Fail('Gagal membaca daftar user. HTTP '+$_.Exception.Response.StatusCode+' keyPrefix='+$key.Substring(0,[Math]::Min(9,$key.Length))+'...')}
$list=if($raw -is [array]){$raw}else{$raw.users}
$u=@($list|Where-Object{$_.email -eq $Email})[0]
if(-not $u){Fail('User tidak ditemukan di proyek ini.')}
$uid=$u.id
Write-Output ("user ketemu: "+$uid.Substring(0,8)+"... (id lengkap hanya di memori)")
$now=[uri]::EscapeDataString([datetime]::UtcNow.ToString('o'))
$passes=(Invoke-WebRequest -Uri ($url+"/rest/v1/trip_passes?user_id=eq."+$uid+"&expires_at=gt."+$now+"&select=id,expires_at,request_limit,requests&order=expires_at.desc&limit=5") -Headers $h -UseBasicParsing -TimeoutSec 30).Content|ConvertFrom-Json
$valid=@($passes)[0]
if($WhatIf){if($valid){Write-Output ("pass aktif: limit {0}, terpakai {1}, sisa {2}, kedaluwarsa {3}" -f $valid.request_limit,$valid.requests,([int]$valid.request_limit-[int]$valid.requests),$valid.expires_at)}else{Write-Output 'tidak ada pass aktif'};Write-Output 'CEK SAJA, tidak ada perubahan';exit 0}
if(-not $Force){if($valid){Write-Output ("AKAN DITAMBAH: limit {0} -> {1} untuk {2}" -f $valid.request_limit,([int]$valid.request_limit+$Amount),$Email)}else{Write-Output ("AKAN DIBUAT: pass baru limit {0} untuk {1}" -f $Amount,$Email)};$jawab=Read-Host 'Ketik YA untuk lanjut (cegah jalan ganda)';if($jawab -ne 'YA'){Write-Output 'DIBATALKAN operator';exit 0}}
if($valid){
 $newLimit=[int]$valid.request_limit+$Amount
 $upd=(Invoke-WebRequest -Uri ($url+"/rest/v1/trip_passes?id=eq."+$valid.id) -Method PATCH -Headers ($h+@{Prefer='return=representation'}) -ContentType 'application/json' -Body (@{request_limit=$newLimit}|ConvertTo-Json -Compress) -UseBasicParsing -TimeoutSec 30).Content|ConvertFrom-Json
 $row=@($upd)[0]
 Write-Output ("pass existing ditambah: limit {0} -> {1}, terpakai {2}, sisa {3}" -f $valid.request_limit,$row.request_limit,$row.requests,([int]$row.request_limit-[int]$row.requests))
}else{
 $exp=[datetime]::UtcNow.AddDays(30).ToString('o')
 $body=@{user_id=$uid;expires_at=$exp;request_limit=$Amount;requests=0;payment_reference='owner-test:manual-grant '+$Amount+' quota 2026-10-31'}|ConvertTo-Json -Compress
 $ins=(Invoke-WebRequest -Uri ($url+'/rest/v1/trip_passes') -Method POST -Headers ($h+@{Prefer='return=representation'}) -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 30).Content|ConvertFrom-Json
 $row=@($ins)[0]
 Write-Output ("pass baru dibuat: limit {0}, terpakai {1}, sisa {2}, kedaluwarsa {3}" -f $row.request_limit,$row.requests,([int]$row.request_limit-[int]$row.requests),$row.expires_at)
}
$key=$null
Write-Output 'SELESAI'
