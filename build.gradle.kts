plugins {
    java
}

group = "com.butterflynetwork"
version = "1.2.1"

repositories {
    mavenCentral()

    maven("https://repo.papermc.io/repository/maven-public/")

    maven("https://jitpack.io")
}

dependencies {
    compileOnly("io.papermc.paper:paper-api:26.2.build.+")

    compileOnly("net.luckperms:api:5.5")

    compileOnly("com.github.MilkBowl:VaultAPI:1.7") {
        exclude(
            group = "org.bukkit",
            module = "bukkit"
        )
    }
}

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(25))
}

tasks.withType<JavaCompile>().configureEach {
    options.release.set(25)
    options.encoding = "UTF-8"
}

tasks.jar {
    archiveBaseName.set("ButterflyNetworkBridge")
}