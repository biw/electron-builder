#!/usr/bin/env node

/**
 * This script prepares packages for publishing to GitHub Packages under the @biw/* scope.
 * It modifies package.json files to:
 * 1. Change package names to @biw/* scope
 * 2. Set version to ${currentVersion}_${shortGitHash}
 * 3. Update internal workspace dependencies to use @biw/* scope
 * 4. Set the registry to GitHub Packages
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packagesDir = path.join(__dirname, '..', 'packages');

// Get short git hash
const shortHash = execSync('git rev-parse --short HEAD').toString().trim();

// Map of original package names to their @biw/* equivalents and versions
const packageInfoMap = new Map();

// First pass: build the mapping of package names and versions
const packageDirs = fs.readdirSync(packagesDir).filter(dir => {
  const packageJsonPath = path.join(packagesDir, dir, 'package.json');
  return fs.existsSync(packageJsonPath);
});

for (const dir of packageDirs) {
  const packageJsonPath = path.join(packagesDir, dir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const originalName = packageJson.name;

  // Skip private packages or test packages
  if (packageJson.private || originalName.includes('test')) {
    continue;
  }

  // Create @biw scoped name
  const scopedName = originalName.startsWith('@')
    ? `@biw/${originalName.split('/')[1]}`
    : `@biw/${originalName}`;

  // Store both the scoped name and the new version
  const newVersion = `${packageJson.version}_${shortHash}`;
  packageInfoMap.set(originalName, { scopedName, newVersion });
}

console.log('Package name mappings:');
for (const [original, info] of packageInfoMap) {
  console.log(`  ${original} -> ${info.scopedName} @ ${info.newVersion}`);
}
console.log('');

// Second pass: update all package.json files
for (const dir of packageDirs) {
  const packageJsonPath = path.join(packagesDir, dir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Skip private packages or test packages
  if (packageJson.private || packageJson.name.includes('test')) {
    console.log(`Skipping ${packageJson.name} (private or test package)`);
    continue;
  }

  const originalName = packageJson.name;
  const packageInfo = packageInfoMap.get(originalName);
  const newName = packageInfo.scopedName;
  const newVersion = packageInfo.newVersion;

  console.log(`Processing ${originalName}:`);
  console.log(`  Name: ${originalName} -> ${newName}`);
  console.log(`  Version: ${packageJson.version} -> ${newVersion}`);

  // Update package name and version
  packageJson.name = newName;
  packageJson.version = newVersion;

  // Update publishConfig to use GitHub Packages
  packageJson.publishConfig = {
    registry: 'https://npm.pkg.github.com',
    access: 'public'
  };

  // Update dependencies to use @biw/* scope
  if (packageJson.dependencies) {
    for (const [depName, depVersion] of Object.entries(packageJson.dependencies)) {
      if (packageInfoMap.has(depName)) {
        const depInfo = packageInfoMap.get(depName);
        delete packageJson.dependencies[depName];
        // Use the dependency's actual version for workspace deps
        packageJson.dependencies[depInfo.scopedName] = depVersion === 'workspace:*' ? depInfo.newVersion : depVersion;
        console.log(`  Dep: ${depName} -> ${depInfo.scopedName} @ ${depInfo.newVersion}`);
      }
    }
  }

  // Update devDependencies to use @biw/* scope
  if (packageJson.devDependencies) {
    for (const [depName, depVersion] of Object.entries(packageJson.devDependencies)) {
      if (packageInfoMap.has(depName)) {
        const depInfo = packageInfoMap.get(depName);
        delete packageJson.devDependencies[depName];
        packageJson.devDependencies[depInfo.scopedName] = depVersion === 'workspace:*' ? depInfo.newVersion : depVersion;
        console.log(`  DevDep: ${depName} -> ${depInfo.scopedName} @ ${depInfo.newVersion}`);
      }
    }
  }

  // Update peerDependencies to use @biw/* scope
  if (packageJson.peerDependencies) {
    for (const [depName, depVersion] of Object.entries(packageJson.peerDependencies)) {
      if (packageInfoMap.has(depName)) {
        const depInfo = packageInfoMap.get(depName);
        delete packageJson.peerDependencies[depName];
        packageJson.peerDependencies[depInfo.scopedName] = depVersion;
        console.log(`  PeerDep: ${depName} -> ${depInfo.scopedName}`);
      }
    }
  }

  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`  Updated ${packageJsonPath}`);
  console.log('');
}

console.log('Done! All packages prepared for GitHub Packages publishing.');
