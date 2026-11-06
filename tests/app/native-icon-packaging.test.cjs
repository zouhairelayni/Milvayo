// /tests/app/native-icon-packaging.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const adapter = 'src/platform/android/AlternateIcons.kt';
const plugin = 'src/platform/plugins/withSafeAlternateIcons.cjs';

test('a clean Git package includes the native icon adapter and its plugin, excluding generated native folders', async () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'milvayo-native-icons-'));
  try {
    const git = (...args) => execFileSync('git', ['-c', 'core.excludesFile=/dev/null', '-C', fixture, ...args], { encoding: 'utf8' });
    git('init', '--quiet');
    for (const file of ['.gitignore', adapter, plugin]) {
      fs.mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true });
      fs.copyFileSync(path.join(root, file), path.join(fixture, file));
    }
    for (const file of ['android/generated.txt', 'ios/generated.txt']) {
      fs.mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true });
      fs.writeFileSync(path.join(fixture, file), 'generated');
    }
    git('add', '--all');
    const packaged = git('ls-files').trim().split('\n');
    assert.ok(packaged.includes(adapter), 'The Kotlin adapter must survive Git packaging, not just exist locally.');
    assert.ok(packaged.includes(plugin));
    assert.ok(!packaged.some(file => /^(android|ios)\//.test(file)));

    // Execute only the plugin callback against an isolated mock dependency, never Expo prebuild.
    const checkout = path.join(fixture, 'checkout');
    for (const file of [adapter, plugin]) {
      fs.mkdirSync(path.dirname(path.join(checkout, file)), { recursive: true });
      fs.writeFileSync(path.join(checkout, file), git('show', ':' + file));
    }
    const packageRoot = path.join(fixture, 'mock-dependency');
    const target = path.join(packageRoot, 'android/src/main/java/expo/modules/alternateappicons/ExpoAlternateAppIconsModule.kt');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'upstream placeholder');
    let apply;
    const localRequire = name => {
      if (name === '@expo/config-plugins') return { withDangerousMod(config, [platform, callback]) {
        assert.equal(platform, 'android');
        apply = callback;
        return config;
      } };
      return require(name);
    };
    localRequire.resolve = name => {
      assert.equal(name, 'expo-alternate-app-icons/package.json');
      return path.join(packageRoot, 'package.json');
    };
    const mod = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(checkout, plugin), 'utf8'), {
      module: mod, require: localRequire, __dirname: path.dirname(path.join(checkout, plugin)),
    }, { filename: plugin });
    const config = { name: 'Milvayo' };
    assert.equal(mod.exports(config), config);
    assert.equal(await apply(config), config);
    assert.equal(fs.readFileSync(target, 'utf8'), fs.readFileSync(path.join(root, adapter), 'utf8'));
    assert.match(fs.readFileSync(target, 'utf8'), /PackageManager\.DONT_KILL_APP/);
    fs.unlinkSync(target);
    await assert.rejects(apply(config), /Android source moved/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
