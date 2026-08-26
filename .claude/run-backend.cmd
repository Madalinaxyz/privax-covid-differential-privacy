@echo off
setlocal
REM Start the Privax Spring Boot backend with a suitable JDK.
REM The project needs Java 17+ (it is built with Java 21). The machine's global
REM JAVA_HOME can point at an older JDK (e.g. Java 8), and Maven prefers JAVA_HOME
REM over PATH, which makes startup fail. So we do NOT rely on the global JAVA_HOME.
REM
REM By default we clear JAVA_HOME so the Maven wrapper uses the 'java' on your PATH.
REM If that java is not 17+, set PRIVAX_JAVA_HOME to a Java 21 (or 17+) JDK folder
REM to override, e.g.  set PRIVAX_JAVA_HOME=C:\Program Files\Java\jdk-21
if defined PRIVAX_JAVA_HOME (
  set "JAVA_HOME=%PRIVAX_JAVA_HOME%"
) else (
  set "JAVA_HOME="
)
cd /d "%~dp0..\privax-api"
call mvnw.cmd spring-boot:run
endlocal
