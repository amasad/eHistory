cur=`pwd`
tmp=ehistory_release_tmp
cd ..
rm -rf $tmp
cp -r $cur $tmp
cd $tmp
rm -rf .git
rm release.sh
cd ..
zip -r ehistory_release.zip $tmp/*
rm -rf $tmp