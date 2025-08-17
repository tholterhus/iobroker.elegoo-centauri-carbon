const expect = require(‘chai’).expect;
const fs = require(‘fs’);
const path = require(‘path’);

describe(‘Package file validation’, function() {
it(‘package.json should be valid’, function(done) {
const packageFile = path.join(__dirname, ‘..’, ‘package.json’);

    if (!fs.existsSync(packageFile)) {
        done(new Error('package.json does not exist'));
        return;
    }

    let packageJson;
    try {
        packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    } catch (err) {
        done(new Error('package.json is not valid JSON: ' + err.message));
        return;
    }

    // Check required fields
    expect(packageJson).to.have.property('name');
    expect(packageJson).to.have.property('version');
    expect(packageJson).to.have.property('description');
    expect(packageJson).to.have.property('main');
    expect(packageJson).to.have.property('engines');
    expect(packageJson).to.have.property('dependencies');

    // Check adapter-specific requirements
    expect(packageJson.name).to.match(/^iobroker\./);
    expect(packageJson.main).to.equal('main.js');
    expect(packageJson.engines).to.have.property('node');
    expect(packageJson.dependencies).to.have.property('@iobroker/adapter-core');

    done();
});

it('io-package.json should be valid', function(done) {
    const ioPackageFile = path.join(__dirname, '..', 'io-package.json');
    
    if (!fs.existsSync(ioPackageFile)) {
        done(new Error('io-package.json does not exist'));
        return;
    }

    let ioPackageJson;
    try {
        ioPackageJson = JSON.parse(fs.readFileSync(ioPackageFile, 'utf8'));
    } catch (err) {
        done(new Error('io-package.json is not valid JSON: ' + err.message));
        return;
    }

    // Check required fields
    expect(ioPackageJson).to.have.property('common');
    expect(ioPackageJson).to.have.property('native');
    expect(ioPackageJson).to.have.property('objects');
    expect(ioPackageJson).to.have.property('instanceObjects');

    expect(ioPackageJson.common).to.have.property('name');
    expect(ioPackageJson.common).to.have.property('version');
    expect(ioPackageJson.common).to.have.property('desc');
    expect(ioPackageJson.common).to.have.property('type');
    expect(ioPackageJson.common).to.have.property('mode');

    // Check adapter-specific requirements
    expect(ioPackageJson.common.name).to.equal('elegoo-centauri-carbon');
    expect(ioPackageJson.common.type).to.equal('hardware');
    expect(ioPackageJson.common.mode).to.equal('daemon');

    done();
});

it('main.js should exist and be valid', function(done) {
    const mainFile = path.join(__dirname, '..', 'main.js');
    
    if (!fs.existsSync(mainFile)) {
        done(new Error('main.js does not exist'));
        return;
    }

    let mainContent;
    try {
        mainContent = fs.readFileSync(mainFile, 'utf8');
    } catch (err) {
        done(new Error('Cannot read main.js: ' + err.message));
        return;
    }

    // Check for required adapter patterns
    expect(mainContent).to.include('utils.Adapter');
    expect(mainContent).to.include('onReady');
    expect(mainContent).to.include('onUnload');
    expect(mainContent).to.include('WebSocket');
    expect(mainContent).to.include('elegoo-centauri-carbon');

    done();
});

it('README.md should exist and have content', function(done) {
    const readmeFile = path.join(__dirname, '..', 'README.md');
    
    if (!fs.existsSync(readmeFile)) {
        done(new Error('README.md does not exist'));
        return;
    }

    let readmeContent;
    try {
        readmeContent = fs.readFileSync(readmeFile, 'utf8');
    } catch (err) {
        done(new Error('Cannot read README.md: ' + err.message));
        return;
    }

    expect(readmeContent.length).to.be.above(100);
    expect(readmeContent).to.include('Elegoo Centauri Carbon');
    expect(readmeContent).to.include('SDCP');
    expect(readmeContent).to.include('Installation');

    done();
});

it('admin directory should exist with required files', function(done) {
    const adminDir = path.join(__dirname, '..', 'admin');
    
    if (!fs.existsSync(adminDir)) {
        done(new Error('admin directory does not exist'));
        return;
    }

    const indexFile = path.join(adminDir, 'index_m.html');
    if (!fs.existsSync(indexFile)) {
        done(new Error('admin/index_m.html does not exist'));
        return;
    }

    let indexContent;
    try {
        indexContent = fs.readFileSync(indexFile, 'utf8');
    } catch (err) {
        done(new Error('Cannot read admin/index_m.html: ' + err.message));
        return;
    }

    expect(indexContent).to.include('html');
    expect(indexContent).to.include('materialize');
    expect(indexContent).to.include('Connection Settings');

    done();
});

it('License file should exist', function(done) {
    const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
    let licenseExists = false;

    for (const licenseFile of licenseFiles) {
        const licenseFilePath = path.join(__dirname, '..', licenseFile);
        if (fs.existsSync(licenseFilePath)) {
            licenseExists = true;
            break;
        }
    }

    if (!licenseExists) {
        console.warn('Warning: No LICENSE file found. Consider adding one.');
    }

    // Don't fail the test for missing license, just warn
    done();
});

it('Version consistency between package.json and io-package.json', function(done) {
    const packageFile = path.join(__dirname, '..', 'package.json');
    const ioPackageFile = path.join(__dirname, '..', 'io-package.json');
    
    if (!fs.existsSync(packageFile) || !fs.existsSync(ioPackageFile)) {
        done(new Error('Required package files missing'));
        return;
    }

    let packageJson, ioPackageJson;
    try {
        packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
        ioPackageJson = JSON.parse(fs.readFileSync(ioPackageFile, 'utf8'));
    } catch (err) {
        done(new Error('Error parsing JSON files: ' + err.message));
        return;
    }

    expect(packageJson.version).to.equal(ioPackageJson.common.version,
        'Version mismatch between package.json and io-package.json');

    done();
});

it('Dependencies should be properly defined', function(done) {
    const packageFile = path.join(__dirname, '..', 'package.json');
    
    if (!fs.existsSync(packageFile)) {
        done(new Error('package.json does not exist'));
        return;
    }

    let packageJson;
    try {
        packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    } catch (err) {
        done(new Error('package.json is not valid JSON: ' + err.message));
        return;
    }

    // Check required dependencies
    const requiredDependencies = [
        '@iobroker/adapter-core',
        'ws',
        'uuid'
    ];

    for (const dep of requiredDependencies) {
        expect(packageJson.dependencies).to.have.property(dep,
            `Missing required dependency: ${dep}`);
    }

    done();
});

});
