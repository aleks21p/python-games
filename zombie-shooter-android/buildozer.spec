[app]

# App name
title = Zombie Shooter

# App package name
package.name = zombieshooter

# App package domain
package.domain = org.zombieshooter

# Source code location
source.dir = .

# Main Python file
source.include_exts = py,png,jpg,kv,atlas

# App version
version = 1.0

# App requirements
requirements = python3,kivy

# Android specific configurations
android.permissions = INTERNET
android.arch = arm64-v8a
android.api = 29
android.minapi = 21
android.ndk = 23b
android.sdk = 30
android.accept_sdk_license = True

# App icon and presplash
#android.presplash_color = #000000
#android.icon = icon.png
#android.presplash = presplash.png

# App orientation
orientation = landscape

# Build options
fullscreen = 1