import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Install script that copies built mod files to Cookie Clicker installation directory
 * Equivalent to the PowerShell build script but using environment variables
 */
async function install(): Promise<void> {
  // Get Cookie Clicker path from environment variable
  const cookieClickerPath = process.env.COOKIECLICKER_PATH;

  if (!cookieClickerPath) {
    console.error('Error: COOKIECLICKER_PATH environment variable is not set.');
    console.error('Please set it in your .env file or environment.');
    process.exit(1);
  }

  // Verify Cookie Clicker path exists
  if (!fs.existsSync(cookieClickerPath)) {
    console.error(`Error: Cookie Clicker path does not exist: ${cookieClickerPath}`);
    process.exit(1);
  }

  const modsPath = path.join(cookieClickerPath, 'resources', 'app', 'mods', 'local');

  // Ensure mods directory exists
  if (!fs.existsSync(modsPath)) {
    console.error(`Error: Mods directory does not exist: ${modsPath}`);
    console.error('Please make sure Cookie Clicker is properly installed.');
    process.exit(1);
  }

  console.log('Installing Cookie Clicker Chinese mods...');
  console.log(`Target directory: ${modsPath}`);

  try {
    // Install CookieClickerCNMod (Simplified Chinese)
    await installMod('CookieClickerCNMod', modsPath, 'static_chs');

    // Install CookieClickerTCNMod (Traditional Chinese)
    await installMod('CookieClickerTCNMod', modsPath, 'static_cht');

    console.log('Installation completed successfully!');
  } catch (error) {
    console.error('Installation failed:', error);
    process.exit(1);
  }
}

/**
 * Install a specific mod variant
 */
async function installMod(modName: string, modsPath: string, staticVariant: string): Promise<void> {
  const buildDir = path.join(__dirname, '..', 'build');
  const resourcesDir = path.join(__dirname, '..', 'resources');
  const targetDir = path.join(modsPath, modName);

  console.log(`Installing ${modName}...`);

  // Create target directory if it doesn't exist
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy built mod files
  const modBuildPath = path.join(buildDir, modName);
  if (fs.existsSync(modBuildPath)) {
    await copyDirectory(modBuildPath, targetDir);
    console.log(`  ✓ Copied mod files from ${modBuildPath}`);
  } else {
    console.warn(`  ⚠ Warning: Mod build directory not found: ${modBuildPath}`);
  }

  // Copy static resources
  const staticPath = path.join(resourcesDir, 'static');
  if (fs.existsSync(staticPath)) {
    await copyDirectory(staticPath, targetDir);
    console.log(`  ✓ Copied static resources from ${staticPath}`);
  } else {
    console.warn(`  ⚠ Warning: Static resources directory not found: ${staticPath}`);
  }

  // Copy variant-specific static resources
  const variantStaticPath = path.join(resourcesDir, staticVariant);
  if (fs.existsSync(variantStaticPath)) {
    await copyDirectory(variantStaticPath, targetDir);
    console.log(`  ✓ Copied ${staticVariant} resources from ${variantStaticPath}`);
  } else {
    console.warn(`  ⚠ Warning: Variant static resources directory not found: ${variantStaticPath}`);
  }
}

/**
 * Recursively copy directory contents
 */
async function copyDirectory(source: string, destination: string): Promise<void> {
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      await copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

// Run the install function if this script is executed directly
if (require.main === module) {
  install().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { install };
