
fileLoader.withGit('git@github.ibm.com:bluemix-mobile-services/bmd-devops-pipeline.git', 'kubernetes_v3', '9d65f30a-9e99-4c24-912a-03aae3e389d6', env.BMS_BUILD_AND_DEPLOY_SWARM_NODE) {
      application = fileLoader.load('src/com/ibm/bmd/Application');
      manifest = fileLoader.load('src/com/ibm/bmd/Manifest');
      git = fileLoader.load('src/com/ibm/bmd/Git');
      environment = fileLoader.load('src/com/ibm/bmd/Environment');
      artifactory = fileLoader.load('src/com/ibm/bmd/Artifactory');
      sonar = fileLoader.load('src/com/ibm/bmd/Sonar');
      vault = fileLoader.load('src/com/ibm/bmd/Vault');
}

def projectName = null
def githubOrg = null
def gitCommit = null
def branch_name = env.BRANCH_NAME
def deployStage = environment.getBluemixEnvironment()
def artifactoryServer = artifactory.getArtifactoryServerName()
println "Entering the node structures"

node (env.BMS_BUILD_AND_DEPLOY_SWARM_NODE) {

   stage 'Checkout'
   deleteDir()
   checkout scm
   projectName = git.getGitRepositoryName()
   githubOrg = git.getGitOrgName()
   gitCommit = manifest.getGitCommit()
   zip_file = projectName + '-' + environment.getBuildNumber() + '.zip'



   println "Variable Values"
   println "Deploy Environment: " + deployStage
   println "artifactoryServer: " + artifactoryServer
   println "projectName: " + projectName
   println "githubOrg: " + githubOrg
   println "gitCommit: " + gitCommit
   println "Build number: " + environment.getBuildNumber()
   println "Branch: " + env.BRANCH_NAME



    if (application.isBuildNeeded(artifactoryServer, githubOrg, projectName, gitCommit)) {
      
       stage 'Build'
       sh 'pwd'
       sh 'ls -lta'
       sh 'echo $PWD'
    
       sh 'pwd'

       //stage 'Build'
       //sh 'mvn clean install -DskipTests -s maven-settings.xml'
       if (env.BRANCH_NAME == null || env.BRANCH_NAME.equals('development') || env.BRANCH_NAME.equals('master')) {

         stage 'Publish mfptile-orchestrator'
         
         withEnv(['deployStage=' + deployStage ]) {
         sh '''
         rm -rf node_modules
         ls -lhtr
         ls -lhtr config/environments/
         rm -fr manifest.yml
         cp manifest_jenkins.yml ./manifest.yml
         if [ "${deployStage}" = "dallas-ys1-dev" ]
         then
              echo '    SUB_ZONE: {{{subzone}}}' >> manifest.yml
         fi
         '''
         }
         def adptgen_files = [ '*']
         application.zipArtifact(deployStage, githubOrg, projectName, gitCommit, adptgen_files)
         sh 'ls -lhtr'
         application.uploadArtifact(deployStage, artifactoryServer, githubOrg, projectName, env.BUILD_NUMBER)
         sh 'rm -rf ' + zip_file
         sh 'ls -lhtr'
      } else {
          println("Found branch is not master or development");
      }

   }
    if (env.BRANCH_NAME == null || env.BRANCH_NAME.equals('development') || env.BRANCH_NAME.equals('master') || env.BRANCH_NAME.equals('test')) {
      println "MFP Tile Lite Orchestrator deployment starting"
      application.deploy(deployStage, artifactoryServer, githubOrg, projectName, environment.getBuildNumber())
      println "MFP Tile Lite Orchestrator deployment Done"
      }
}

