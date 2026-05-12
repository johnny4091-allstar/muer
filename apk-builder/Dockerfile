FROM eclipse-temurin:17-jdk-focal

# System tools
RUN apt-get update && apt-get install -y wget unzip curl && rm -rf /var/lib/apt/lists/*

# Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmd.zip && \
    unzip -q /tmp/cmd.zip -d $ANDROID_HOME/cmdline-tools && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && \
    rm /tmp/cmd.zip

RUN yes | sdkmanager --licenses > /dev/null && \
    sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2"

# Gradle
RUN wget -q https://services.gradle.org/distributions/gradle-8.4-bin.zip -O /tmp/gradle.zip && \
    unzip -q /tmp/gradle.zip -d /opt && rm /tmp/gradle.zip
ENV PATH=$PATH:/opt/gradle-8.4/bin

# Node.js for worker
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Worker
WORKDIR /worker
COPY package.json ./
RUN npm install
COPY prisma ./prisma
RUN node_modules/.bin/prisma generate
COPY . .
RUN node_modules/.bin/tsc

CMD ["node", "dist/builder.js"]
