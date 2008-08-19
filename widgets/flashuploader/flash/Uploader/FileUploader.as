package Uploader {
	import flash.external.*;
	import flash.events.*;
	import flash.net.FileFilter;
	import flash.net.FileReference;
	import flash.net.FileReferenceList;
    import flash.net.navigateToURL;
	

	
	/*
		File Uploader :: trida, ktera obstarava praci se soubory jako je jejich
		vyber, nahrani, odstraneni z fronty a odchytavani chyb pri nahravani.
		Pracuje vzdy nad specifickymi daty, ktere ziska z tridy Uploader dle
		aktivniho id (id javascriptove aplikace, ktera flash vola)
	*/
	public class FileUploader {
		/* seznam souboru */
		private var file:FileReferenceList;
		/* data k jednotlivemu souboru ??? */
		public var test:FileReference;
		/* reference na hlavni tridu balicku */
		public var main:Object;
		/* delka aktualne zpracovavane fronty */
		private var dataLength:int = 0;
		
		public function FileUploader(main:Object){
			this.main = main;
			this.addCallbacks();
		}
		/* nahozeni poslochacu */
		private function setSelectListeners(dispatcher:IEventDispatcher):void{
			//dispatcher.addEventListener(Event.CANCEL, cancelHandler);
			//dispatcher.addEventListener(Event.COMPLETE, completeHandler);
			dispatcher.addEventListener(Event.SELECT, this.selectHandler);
			//dispatcher.addEventListener(DataEvent.UPLOAD_COMPLETE_DATA,uploadCompleteDataHandler);			
		}
		/* odebrani posluchace na select */
		private function removeSelectListeners(dispatcher:IEventDispatcher):void{
			dispatcher.removeEventListener(Event.SELECT, this.selectHandler);
		}
		/* registrace metod volanych z javascriptu */
		private function addCallbacks():void{
			ExternalInterface.addCallback('openDialog',this.openDialog);
			ExternalInterface.addCallback('removeItem',this.removeItem);
			ExternalInterface.addCallback('myUpload',this.myUpload);
			ExternalInterface.addCallback('getFullUploadSize',this.getFullUploadSize);
			ExternalInterface.addCallback('removeAll',this.removeAllItems);
			ExternalInterface.addCallback('getItem',this.getItem);
		}
		/* progress jednoho uploadu*/
		private function progressHandler(event:ProgressEvent):void{
			var file:FileReference = FileReference(event.target);
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			var fileData:Object = folder.getUploadDataByFile(file);
			
			var proc:Number = Math.round((event.bytesLoaded/event.bytesTotal)*100);
			var prevSize:Number = fileData.uploadSize;
			var loadedSize:Number = event.bytesLoaded - prevSize;
			fileData.uploadSize = event.bytesLoaded;
			
			main.comunicator.callJsApsObj("showProgress",{'index':fileData.id,'num':proc,'loaded':loadedSize});
		}
		/* handlovani udalosti po uspesnem odeslani dat */
		private function uploadCompleteDataHandler(event:DataEvent):void {
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			
			var file:FileReference = FileReference(event.target);
			var fileData:Object = folder.getUploadDataByFile(file);
			fileData.status = 'uploaded';
			var resp:Boolean = main.comunicator.callJsApsObj('oneUploadEnd',{'index':fileData.id,'data':event.data});
			//trace('-->response = ' + resp)
			this.decreaseData(file,0,resp);
		}		
		/* snizuji citac fronty souboru ke zpracovani (bud korektni konec nebo z prvni zachycene chyby) */
		private function decreaseData(fileData:Object,fileError:Number,isError:Boolean):void{
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			var useDecrease:Boolean = fileData ? true : false;
			var file:Object = folder.getUploadDataByFile(fileData);
			if(fileError && !file.error){
				file.error = fileError
				main.comunicator.callJsApsObj('oneUploadEnd',{'index':file.id,'data':{error:fileError,name:file.file.name}});
			} else if (fileError && file.error){
				useDecrease = false;
			}
			
			if(!isError){
				folder.uploadedCount++;
			}
			
			
			//trace('decrease 01 :: ' + file.file.name + ' -- ' + folder.uploadPossCount)
			if(useDecrease){
				folder.dataLength--;
				folder.uploadPossCount--;
			} else {
				return;
			}
			//trace('decrease 02 :: ' + file.file.name + ' -- ' + folder.uploadPossCount + ' ** ' + folder.uploadedCount)
			if(!folder.uploadPossCount){
				this.uploadTotalComplete();
				return;
			}
		}
		
		/* skoncil jsem s nahravanim (bez chyb, nebo byly zachyceny prvni vznikle chyby pro kazdy soubor )*/
		private function uploadTotalComplete():void{
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			var fileData:Object = folder.getUploadData();
			// odstranim data k nahranym souborum a pregeneruji indexy
			for(var i:String in folder.getUploadData()){
				if(folder.getUploadData()[i].status == 'uploaded' && (!folder.getUploadData()[i].error)){
					folder.getUploadData()[i] = null;
					delete(folder.getUploadData()[i]);
				}
			}
			folder.rebuildDataIndex();
			if(!folder.getDataIndex().length){
				folder.clear();
			} else {
				folder.dataLength = folder.getDataIndex().length;
				folder.rebuildPossCount();
				//trace(' + ' + folder.uploadPossCount + ' + ')
			}
			this.main.comunicator.callJsApsArr('uploadEnd',folder.getDataIndex());
		}
		
		/* zachceni udalosti vyberu souboru */
		private function selectHandler(event:Event):void {
			this.removeSelectListeners(this.file);
			var file:FileReferenceList = FileReferenceList(event.target);
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			
			for(var i:int = 0; i < file.fileList.length; i++){
				var m:String = folder.addUploadItem(file.fileList[i]);
			}
			
			this.main.comunicator.callJsApsArr("setData",folder.getDataIndex());

		}	
		/* odebrani jednoho souboru */
		public function removeItem(id:String):void{
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			folder.removeUploadItem(id);
			main.comunicator.callJsApsArr("setData",folder.getDataIndex());
		}
		/* odebrani vsech souboru */
		public function removeAllItems():void{
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			folder.clear();
			this.main.comunicator.callJsApsStr("clear");
		}
		/* vyvolani dialogu pro vyber souboru */
		public function openDialog():void{
			this.file = new FileReferenceList();
			this.setSelectListeners(file);
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			var types:Array = folder.getFileTypes();
			this.file.browse(types);
		}
		/* vracim jednu polozku z fronty */
		public function getItem(id:String):Object{
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			var fileData:Object = folder.getUploadData();
			
			if(fileData[id]){
				return fileData[id];
			} else {
				return null;
			}
		}
		
		/* vlastni nahrani vybranych souboru na server */
		public function myUpload():void{
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			var cnt:Number = 1;
			//folder.reSetErrorData();
			var myData:Object = folder.getUploadData();
			// zjistim, kolik lze jeste nahrat souboru
			var possibleCount:Number = !folder.maxFilesCount ? -1 : folder.maxFilesCount - folder.uploadedCount
			//trace('possibleCount  = ' + possibleCount)
			var dataIndex:Array = folder.getDataIndex();
			for(var i:int = 0; i < dataIndex.length; i++){
				var name:String = dataIndex[i];
				if((myData[name].error < 1 ||  myData[name].error > 5) 
				&& ((possibleCount < 0) || (cnt <= possibleCount))
				&& (myData[name].status != 'uploaded')){
					cnt++;
					//trace(cnt + ' ??')
					myData[name].error = 0;
					myData[name].file.addEventListener(HTTPStatusEvent.HTTP_STATUS, httpStatusHandler,false,100);
					myData[name].file.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler,false,50);	
					myData[name].file.addEventListener(SecurityErrorEvent.SECURITY_ERROR, securityErrorHandler,false,25);
					myData[name].file.addEventListener(ProgressEvent.PROGRESS, progressHandler);
					myData[name].file.addEventListener(DataEvent.UPLOAD_COMPLETE_DATA, uploadCompleteDataHandler);
					myData[name].file.upload(folder.getRequest(),"f");
				}
			}
		}
		/* vraci sumu velikosti vsech vybranych souboru  */
		public function getFullUploadSize():Number{
			var folder:Object = this.main.getDataFolder(main.getActiveId());
			return folder.getUploadSize();
		}
		
		// vracen chybny http status
		private function httpStatusHandler(e:HTTPStatusEvent):void{
			this.decreaseData(e.target,7,false);
		}
		
		// doslo k chybe pri prenosu
		private function ioErrorHandler(e:IOErrorEvent):void{
			this.decreaseData(e.target,8,false);
		}
	
		// doslo k bezpecnostni chybe pri prenosu
		private function securityErrorHandler(e:SecurityErrorEvent):void{
			this.decreaseData(e.target,9,false);
		}
	}
}
